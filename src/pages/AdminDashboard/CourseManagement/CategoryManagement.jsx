import { useState, useEffect, useCallback } from "react";
import { AddCircle, Folder2, MinimalisticMagnifier, Pen, TagPrice, TrashBinMinimalistic } from "@solar-icons/react"
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { coursesApi } from "../../../api";


const CategoryManagement = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  // List state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Create/Edit modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;

      const response = await coursesApi.getCategories(params);
      const data = response.data;
      setCategories(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalItems || 0);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  // Open create modal
  const handleCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormType("");
    onOpen();
  };

  // Open edit modal
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormName(category.name || "");
    setFormDescription(category.description || "");
    setFormType(category.type || "");
    onOpen();
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType.trim(),
      };
      if (editingCategory) {
        await coursesApi.updateCategory(editingCategory.id, data);
        addToast({
          title: t("adminDashboard.categories.updateSuccess"),
          color: "success",
        });
      } else {
        await coursesApi.createCategory(data);
        addToast({
          title: t("adminDashboard.categories.createSuccess"),
          color: "success",
        });
      }
      onClose();
      fetchCategories();
    } catch (error) {
      addToast({
        title: editingCategory
          ? t("adminDashboard.categories.updateFailed")
          : t("adminDashboard.categories.createFailed"),
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await coursesApi.deleteCategory(categoryToDelete.id);
      addToast({
        title: t("adminDashboard.categories.deleteSuccess"),
        color: "success",
      });
      onDeleteClose();
      fetchCategories();
    } catch (error) {
      addToast({
        title: t("adminDashboard.categories.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.categories.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.categories.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            startContent={<AddCircle weight="BoldDuotone" className="w-4 h-4" />}
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
            onPress={handleCreate}
          >
            {t("adminDashboard.categories.addCategory")}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.background.primaryLight }}
                >
                  <Folder2
                    className="w-5 h-5"
                    weight="BoldDuotone"
                    style={{ color: colors.primary.main }}
                  />
                </div>
                <div>
                  <p
                    className="text-xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {totalCount.toLocaleString()}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.categories.totalCategories")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4">
            <Input
              type="text"
              placeholder={t("adminDashboard.categories.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={
                <MinimalisticMagnifier weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.text.secondary }}
                />
              }
              classNames={inputClassNames}
            />
          </CardBody>
        </Card>
      </motion.div>

      {/* Categories Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/5 rounded-lg" />
                      <Skeleton className="h-3 w-1/4 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.categories.noData")}
                </p>
              </div>
            ) : (
              <Table
                aria-label="Categories table"
                classNames={tableClassNames}
                bottomContent={
                  totalPages > 1 ? (
                    <div className="flex w-full justify-center py-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={totalPages}
                        onChange={(p) => setPage(p)}
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn>
                    {t("adminDashboard.categories.table.name")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.description")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.type")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.createdAt")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TagPrice weight="BoldDuotone"
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: colors.primary.main }}
                          />
                          <span
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {cat.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm line-clamp-2"
                          style={{ color: colors.text.secondary }}
                        >
                          {cat.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {cat.type ? (
                          <Chip size="sm" variant="flat">
                            {cat.type}
                          </Chip>
                        ) : (
                          <span style={{ color: colors.text.secondary }}>
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {formatDate(cat.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleEdit(cat)}
                          >
                            <Pen weight="BoldDuotone"
                              className="w-4 h-4"
                              style={{ color: colors.primary.main }}
                            />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleDeleteClick(cat)}
                          >
                            <TrashBinMinimalistic weight="BoldDuotone"
                              className="w-4 h-4"
                              style={{ color: colors.state.error }}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {editingCategory
                  ? t("adminDashboard.categories.editCategory")
                  : t("adminDashboard.categories.addCategory")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label={t("adminDashboard.categories.form.name")}
                    placeholder={t(
                      "adminDashboard.categories.form.namePlaceholder",
                    )}
                    value={formName}
                    onValueChange={setFormName}
                    classNames={inputClassNames}
                    isRequired
                  />
                  <Input
                    label={t("adminDashboard.categories.form.description")}
                    placeholder={t(
                      "adminDashboard.categories.form.descriptionPlaceholder",
                    )}
                    value={formDescription}
                    onValueChange={setFormDescription}
                    classNames={inputClassNames}
                  />
                  <Input
                    label={t("adminDashboard.categories.form.type")}
                    placeholder={t(
                      "adminDashboard.categories.form.typePlaceholder",
                    )}
                    value={formType}
                    onValueChange={setFormType}
                    classNames={inputClassNames}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={saving}>
                  {t("adminDashboard.categories.cancel")}
                </Button>
                <Button
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={handleSave}
                  isLoading={saving}
                  isDisabled={!formName.trim()}
                >
                  {t("adminDashboard.categories.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.categories.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.categories.confirmDeleteMsg")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={deleting}>
                  {t("adminDashboard.categories.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteConfirm}
                  isLoading={deleting}
                >
                  {t("adminDashboard.categories.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
